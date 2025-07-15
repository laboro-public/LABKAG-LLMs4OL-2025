import json
import random
import re
from typing import Any

from tqdm import tqdm
from transformers import AutoModelForCausalLM, AutoTokenizer


def qwen_gen(
    prompt_template: str,
    tokenizer: AutoTokenizer,
    model: AutoModelForCausalLM,
    enable_thinking: bool = False,
    **prompt_template_kwargs,
) -> str:
    prompt = prompt_template.format(**prompt_template_kwargs)
    messages = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=enable_thinking,
    )
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    generated_ids = model.generate(**model_inputs, max_new_tokens=32768)
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]) :].tolist()

    # parsing thinking content
    try:
        # rindex finding 151668 (</think>)
        index = len(output_ids) - output_ids[::-1].index(151668)
    except ValueError:
        index = 0

    content = tokenizer.decode(output_ids[index:], skip_special_tokens=True).strip("\n")
    return content


def raw_ee_line2entity(entity_line: str, lower: bool = True) -> str:
    if lower:
        return entity_line.strip().split("|||")[1].lower()
    else:
        return entity_line.strip().split("|||")[1]


def raw_ee_line2cat(entity_line: str, lower: bool = True) -> str:
    if lower:
        return entity_line.strip().split("|||")[2].lower()
    else:
        return entity_line.strip().split("|||")[2]


def raw_ee_line2des(entity_line: str, lower: bool = True) -> str:
    if lower:
        return entity_line.strip().split("|||")[3].strip().lower()
    else:
        return entity_line.strip().split("|||")[3].strip()


def ee_prompt_2_preprocess(
    example_string_template: str,
    example_outputs: dict[str, Any],
    train_example_docs: dict[str, Any],
) -> str:
    example_strings = []
    for doc in train_example_docs:
        example_strings.append(
            example_string_template.format(
                title=doc["title"],
                text=doc["text"],
                example_output=example_outputs[doc["id"]],
            )
        )
    examples_string = "\n\n".join(example_strings)
    return examples_string


def ec_prompt_1_preprocess(ee_contents: dict[str, Any]) -> str:
    list_of_entities_with_description = ""
    for doc_id, content in ee_contents.items():
        for entity_line in content.splitlines():
            entity_name = raw_ee_line2entity(entity_line)
            try:
                entity_desc = raw_ee_line2des(entity_line, lower=False)
            except:
                entity_desc = raw_ee_line2cat(entity_line, lower=False)
            list_of_entities_with_description += f"{entity_name}: {entity_desc}\n"
    return list_of_entities_with_description


def ec_prompt_1_generate(
    subset: str,
    list_of_entities_with_description: str,
    **qwen_gen_kwargs: dict[str, Any],
) -> tuple[list[dict[str, str]], list[str]]:
    all_class_responses = []
    unreadable_responses = []
    for line in tqdm(
        list_of_entities_with_description.splitlines(), desc=f"Processing {subset}"
    ):
        class_response = qwen_gen(
            **qwen_gen_kwargs, list_of_entities_with_description=line
        )
        # Process raw response into JSON format
        try:
            all_class_responses += json.loads(class_response)
        except:
            try:
                all_class_responses.append(
                    json.loads(
                        re.findall(r"\[\s*{.*?}\s*\]", class_response, re.DOTALL)[0]
                    )[0]
                )
            except:
                unreadable_responses.append(class_response)

    return all_class_responses, unreadable_responses


def ec_prompt_1_postprocess(
    all_class_responses: list[dict[str, str]],
) -> tuple[list[str], list[str]]:
    extracted_terms = []
    extracted_types = []
    for ent_dict in all_class_responses:
        try:
            assert ent_dict["classification"] in ("term", "type")
        except:
            continue
        if ent_dict["classification"] == "term":
            extracted_terms.append(ent_dict["entity"])
        elif ent_dict["classification"] == "type":
            extracted_types.append(ent_dict["entity"])
    extracted_terms = list(set(extracted_terms))
    extracted_types = list(set(extracted_types))

    return extracted_terms, extracted_types


def ec_prompt_2_preprocess(
    example_train_docs: list[dict[str, str]],
    example_doc_entities: dict[str, str],
    example_template: str,
    ee_contents: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    example_list = []
    for train_doc in example_train_docs:
        doc_id = train_doc["id"]
        entity_list = (
            example_doc_entities[doc_id]["terms"]
            + example_doc_entities[doc_id]["types"]
        )
        random.shuffle(entity_list)
        example_output_list = []
        for entity in entity_list:
            if entity in example_doc_entities[doc_id]["terms"]:
                example_output_list.append(f"{entity}|||term")
            else:
                example_output_list.append(f"{entity}|||type")

        example_list.append(
            example_template.format(
                title=train_doc["title"],
                text=train_doc["text"],
                entities="\n".join(entity_list),
                example_output="\n".join(example_output_list),
            )
        )
    examples_string = "\n\n".join(example_list)

    extracted_entities = {}
    for doc_id in ee_contents:
        extracted_entities[doc_id] = []
        content = ee_contents[doc_id]
        for entity_line in content.splitlines():
            extracted_entities[doc_id].append(raw_ee_line2entity(entity_line))

    return examples_string, extracted_entities


def ec_prompt_2_postprocess(contents: dict[str, str]) -> tuple[list[str], list[str]]:
    extracted_terms = []
    extracted_types = []
    for doc_id in contents:
        for line in contents[doc_id].splitlines():
            try:
                e, c = line.strip().split("|||")
                assert c.lower() in ("term", "type")
                if c.lower() == "term":
                    extracted_terms.append(e.lower())
                elif c.lower() == "type":
                    extracted_types.append(e.lower())
            except:
                print(line)
                continue
    extracted_terms = list(set(extracted_terms))
    extracted_types = list(set(extracted_types))
    return extracted_terms, extracted_types
