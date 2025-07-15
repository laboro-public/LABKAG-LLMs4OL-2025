import argparse
import json
import os

from src.prompts import (
    plain_classification_customized_example_string,
    plain_classification_engineering_customized_examples_prompt,
    plain_classification_prompt_engineering,
    plain_classification_prompt_scholarly,
    plain_classification_scholarly_customized_examples_prompt,
)
from src.utils import (
    ec_prompt_1_generate,
    ec_prompt_1_postprocess,
    ec_prompt_1_preprocess,
    ec_prompt_2_postprocess,
    ec_prompt_2_preprocess,
    qwen_gen,
)
from tqdm import tqdm
from transformers import AutoModelForCausalLM, AutoTokenizer


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "prompt", choices=["1", "2"], help="choose between EC Prompt 1 & 2"
    )
    parser.add_argument(
        "--data_dir",
        "-d",
        default="data/LLMs4OL-Challenge/2025/TaskA-Text2Onto",
        help="path to input data directory",
    )
    parser.add_argument(
        "--example_dir",
        "-e",
        default="data/few_shot_examples",
        help="path to few-shot examples directory",
    )
    parser.add_argument(
        "--ee_output_dir",
        "-p",
        default="output/LLMs4OL_TaskA_Entity_Extraction",
        help="path to the directory of intermediate output from entity extraction",
    )
    parser.add_argument(
        "--output_dir",
        "-o",
        default="output/LLMs4OL_TaskA_Entity_Classification",
        help="path to output directory",
    )

    args = parser.parse_args()

    # Load model and tokenizer
    model_name = "Qwen/Qwen3-8B"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, torch_dtype="auto", device_map="auto"
    )

    subsets = ("engineering", "scholarly")
    for subset in subsets:
        # Load data
        testdata_dir = os.path.join(args.data_dir, f"{subset}/test")
        with open(
            os.path.join(testdata_dir, f"text2onto_{subset}_test_documents.jsonl"), "r"
        ) as f:
            test_docs = [json.loads(line) for line in f]

        # Load data and prepare the model input
        ee_contents = json.load(
            open(os.path.join(args.ee_output_dir, f"{subset}/contents.json"))
        )

        if args.prompt == "1":
            if subset == "engineering":
                prompt_template = plain_classification_prompt_engineering
            elif subset == "scholarly":
                prompt_template = plain_classification_prompt_scholarly

            # Prepare model input
            entities_with_description = ec_prompt_1_preprocess(ee_contents)

            # Conduct text completion
            all_class_responses, unreadable_responses = ec_prompt_1_generate(
                subset,
                entities_with_description,
                prompt_template=prompt_template,
                tokenizer=tokenizer,
                model=model,
            )

            # Save model responses
            output_dir = os.path.join(args.output_dir, subset)
            os.makedirs(output_dir, exist_ok=True)
            json.dump(
                all_class_responses,
                open(os.path.join(output_dir, "classification_responses.json"), "w"),
                indent=2,
            )
            json.dump(
                unreadable_responses,
                open(os.path.join(output_dir, "unreadable_responses.json"), "w"),
                indent=2,
            )

            # Extract terms and types
            extracted_terms, extracted_types = ec_prompt_1_postprocess(
                all_class_responses
            )

        elif args.prompt == "2":
            example_template = plain_classification_customized_example_string
            if subset == "engineering":
                prompt_template = (
                    plain_classification_engineering_customized_examples_prompt
                )
            elif subset == "scholarly":
                prompt_template = (
                    plain_classification_scholarly_customized_examples_prompt
                )

            example_doc_entities = json.load(
                open(
                    os.path.join(
                        args.example_dir,
                        f"entity_classification/{subset}/example_doc_entities.json",
                    )
                )
            )

            with open(
                os.path.join(args.data_dir, f"{subset}/train/documents.jsonl")
            ) as f:
                example_train_docs = [
                    json.loads(line)
                    for line in f
                    if json.loads(line)["id"] in example_doc_entities
                ]

            with open(
                os.path.join(
                    args.data_dir,
                    f"{subset}/test/text2onto_{subset}_test_documents.jsonl",
                )
            ) as f:
                test_docs = [json.loads(line) for line in f]

            examples_string, extracted_entities = ec_prompt_2_preprocess(
                example_train_docs, example_doc_entities, example_template, ee_contents
            )

            contents = {}
            for test_doc in tqdm(test_docs, desc=f"Processing {subset}"):
                doc_id = test_doc["id"]
                contents[doc_id] = qwen_gen(
                    prompt_template,
                    tokenizer,
                    model,
                    examples_string=examples_string,
                    title=test_doc["title"],
                    text=test_doc["text"],
                    entities="\n".join(extracted_entities[doc_id]),
                )

            output_dir = os.path.join(args.output_dir, subset)
            os.makedirs(output_dir, exist_ok=True)
            json.dump(
                contents, open(os.path.join(output_dir, "contents.json"), "w"), indent=2
            )

            extracted_terms, extracted_types = ec_prompt_2_postprocess(contents)

        with open(os.path.join(output_dir, "terms.txt"), "w") as fout:
            for t in extracted_terms:
                fout.write(t + "\n")
        with open(os.path.join(output_dir, "types.txt"), "w") as fout:
            for t in extracted_types:
                fout.write(t + "\n")


if __name__ == "__main__":
    main()
