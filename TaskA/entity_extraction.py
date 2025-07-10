import argparse
import json
import os

from src.prompts import (
    entity_extraction_customized_example_string,
    entity_extraction_customized_examples_prompt,
    entity_extraction_prompt,
)
from src.utils import ee_prompt_2_preprocess, qwen_gen, raw_ee_line2entity
from tqdm import tqdm
from transformers import AutoModelForCausalLM, AutoTokenizer


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "prompt", choices=["1", "2"], help="choose between EE Prompt 1 & 2"
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
        help="path to input data directory",
    )
    parser.add_argument(
        "--output_dir",
        "-o",
        default="output/LLMs4OL_TaskA_Entity_Extraction",
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

        # Select and form prompt
        if args.prompt == "1":
            prompt_template = entity_extraction_prompt
            prompt_template_kwargs = {}

        elif args.prompt == "2":
            prompt_template = entity_extraction_customized_examples_prompt
            example_string_template = entity_extraction_customized_example_string
            example_outputs = json.load(
                open(
                    os.path.join(
                        args.example_dir,
                        f"entity_extraction/{subset}/doc_examples.json",
                    )
                )
            )

            with open(
                os.path.join(args.data_dir, f"{subset}/train/documents.jsonl"), "r"
            ) as f:
                train_example_docs = [
                    json.loads(line)
                    for line in f
                    if json.loads(line)["id"] in example_outputs
                ]

            examples_string = ee_prompt_2_preprocess(
                example_string_template, example_outputs, train_example_docs
            )
            prompt_template_kwargs = {"examples_string": examples_string}

        # Prepare the model input and conduct text completion
        contents = {}
        for doc in tqdm(test_docs, desc=f"Processing {subset}"):
            prompt_template_kwargs["title"] = doc["title"]
            prompt_template_kwargs["text"] = doc["text"]
            contents[doc["id"]] = qwen_gen(
                prompt_template, tokenizer, model, **prompt_template_kwargs
            )

        # Prepare output directory
        output_dir = os.path.join(args.output_dir, subset)
        os.makedirs(output_dir, exist_ok=True)

        # Save model responses
        content_output_path = os.path.join(output_dir, "contents.json")
        with open(content_output_path, "w") as fout:
            json.dump(contents, fout, indent=2)

        # Post-process
        all_extracted_entities = []
        for doc_id in contents:
            content = contents[doc_id]
            for entity_line in content.splitlines():
                all_extracted_entities.append(raw_ee_line2entity(entity_line))
        all_extracted_entities = list(set(all_extracted_entities))

        # Save final output
        with open(os.path.join(output_dir, "terms.txt"), "w") as fout:
            for term in all_extracted_entities:
                fout.write(term + "\n")
        with open(os.path.join(output_dir, "types.txt"), "w") as fout:
            for type in all_extracted_entities:
                fout.write(type + "\n")


if __name__ == "__main__":
    main()
