# LABKAG at LLMs4OL 2025 Tasks A and C: Context-Rich Prompting for Ontology Construction

This repository contains the implementation of methods described in our paper:
[LABKAG at LLMs4OL 2025 Tasks A and C: Context-Rich Prompting for Ontology Construction](url.place.holder),
a submission to the [LLMs4OL 2025 Challenge](https://sites.google.com/view/llms4ol2025) at [the 24th International Semantic Web Conference (ISWC 2025)](<(https://iswc2025.semanticweb.org/)>).

The project demonstrates how Large Language Models (LLMs) can support ontology construction, which serves as the structural backbone of knowledge graphs. Our approach focuses on prompt design, showing that even without fine-tuning or external knowledge, LLMs are able to extract relevant entities and hierarchies directly from text when provided well-designed prompts and rich contextual information.

## Setup

```bash
git clone https://github.com/laboro-public/LABKAG-LLMs4OL-2025.git
cd LABKAG-LLMs4OL-2025
pip install -r requirements.txt
```

## Task A: Text2Onto

- Task A uses a locally deployed Qwen3-8B model.
- The dataset is available at: https://github.com/sciknoworg/LLMs4OL-Challenge/tree/main/2025/TaskA-Text2Onto
- Please download the data and place it in the following directory:
  `LABKAG-LLMs4OL-2025/TaskA/data/LLMs4OL-Challenge/2025/TaskA-Text2Onto`

#### Step 1: Entity Extraction

```bash
cd TaskA
python entity_extraction.py 1 # use EE Prompt 1
python entity_extraction.py 2 # use EE Prompt 2
```

#### Step 1: Entity Classification

```bash
python entity_classification.py 1 # use EC Prompt 1
python entity_classification.py 2 # use EC Prompt 2
```

## Task C: TaxonomyDiscovery

- Task C utilizes either OpenAI or Gemini.
- The dataset is available at: https://github.com/sciknoworg/LLMs4OL-Challenge/tree/main/2025/TaskC-TaxonomyDiscovery

#### Run with Gemini

```bash
cd TaskC/gemini
npm install
npm start
```

#### Run with OpenAI

```bash
cd TaskC/openai

For backend API
cd api
pnpm install
pnpm start

For frontend UI
cd front
pnpm install
pnpm start
```
