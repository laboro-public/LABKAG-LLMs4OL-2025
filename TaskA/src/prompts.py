entity_extraction_prompt = '''\
You are assisting in the construction of a domain-specific ontology by extracting meaningful entities from text.
Each entity should represent a concept relevant to the domain, including both general categories (e.g., "Bean") and specific subtypes (e.g., "Bean (Dried)").
Note that entities can overlap conceptually or hierarchically — do not exclude broader or more abstract terms just because more specific variants also appear.

Given a document, extract important domain terms (entities) and assign each one a generalized type, such as Concept, Process, Unit, Method, Material, Organism, Product, Ingredient, Category, etc.
For each identified entity, extract the following information:
- entity_name: Name of the entity
- entity_type: Type of the entity
- entity_description: Comprehensive description of the entity's attributes and activities
Format each entity as ("entity"|||<entity_name>|||<entity_type>|||<entity_description>)

######################
-Example-
######################
Input:
Title: Classification of Bean Food Products
Text: Bean food products are a diverse group of edible items derived from various types of beans. These products are categorized based on the type of bean used, the processing method, and the final form of the product. Fermented bean products, for instance, are a type of bean food product that has undergone fermentation, with fermented soybean food product being a specific example. Other types of bean food products include dry pea food product, cowpea (pulse) food product, yam bean food product, hyacinth bean food product, winged bean food product, broad bean food product, common bean food product, lupine bean food product, and soybean food product.\n\nBroad bean, for example, is classified as a broad bean food product. Similarly, dry bean food product is a subcategory of common bean food product, and lupin seed food product falls under lupine bean food product. Soybean food product is another significant category, with fermented soybean food product being a subtype. The term "bean" refers to a broad category of bean food products, which includes bean (dried), broad bean, jack bean, and velvet bean. Specifically, jack bean is categorized as a jack-bean food product, and velvet bean is classified as a velvet bean food product. Furthermore, bean (whole or pieces) is a type of bean food product, with chickpea food product being a specific type of bean (whole or pieces). Cooked beans are also classified under bean (whole or pieces).
######################
Output:
("entity"|||Bean|||Category|||A general class of edible items made from various types of beans, including multiple subcategories based on bean type and processing method.)
("entity"|||Bean Food Product|||Category|||A general class of edible items made from various types of beans, including multiple subcategories based on bean type and processing method.)
("entity"|||Fermented Bean Product|||ProcessedProduct|||A type of bean food product that has undergone fermentation, often used to enhance flavor, texture, or shelf life.)
("entity"|||Fermented Soybean Food Product|||ProcessedProduct|||A specific fermented product made from soybeans, representing a subtype of fermented bean products.)
("entity"|||Dry Pea Food Product|||Product|||A bean-based food product derived specifically from dry peas, falling under the category of bean food products.)
("entity"|||Cowpea (Pulse) Food Product|||Product|||A bean food product made from cowpeas, a pulse commonly used in traditional dishes and valued for its protein content.)
("entity"|||Yam Bean Food Product|||Product|||A food product derived from yam beans, known for its starchy and slightly sweet root used in various cuisines.)
("entity"|||Hyacinth Bean Food Product|||Product|||A product derived from hyacinth beans, used in cooking and traditional recipes in some cultures.)
("entity"|||Winged Bean Food Product|||Product|||A food product made from winged beans, which are nutrient-rich and often used whole or in parts.)
("entity"|||Broad Bean Food Product|||Product|||A product derived from broad beans, commonly consumed cooked and often used in stews or mashed.)
("entity"|||Common Bean Food Product|||Product|||A food product originating from common beans, which includes popular types such as kidney, pinto, and black beans.)
("entity"|||Lupine Bean Food Product|||Product|||A food product derived from lupine beans, known for their protein richness and use in plant-based diets.)
("entity"|||Soybean Food Product|||Product|||A widely consumed food product made from soybeans, serving as a basis for various processed foods including tofu and miso.)
("entity"|||Dry Bean Food Product|||Subcategory|||A specific subcategory of common bean food products referring to dried beans before cooking.)
("entity"|||Lupin Seed Food Product|||Product|||A product derived from the seeds of lupine beans, used in various high-protein food preparations.)
("entity"|||Jack Bean|||Ingredient|||A species of bean classified as part of the broader bean category, used in food and sometimes as green manure.)
("entity"|||Jack-Bean Food Product|||Product|||A food product made from jack beans, typically processed for consumption or use in traditional cooking.)
("entity"|||Velvet Bean|||Ingredient|||A tropical legume used as a food source and sometimes as a medicinal ingredient, classified under beans.)
("entity"|||Velvet Bean Food Product|||Product|||A food product made from velvet beans, typically processed and cooked before consumption.)
("entity"|||Bean (Whole or Pieces)|||Category|||A category of bean food products that includes whole beans or bean fragments, commonly used in cooked dishes.)
("entity"|||Chickpea Food Product|||Product|||A specific type of bean (whole or pieces) food product derived from chickpeas, widely used in global cuisines.)
("entity"|||Cooked Beans|||Product|||Beans that have been prepared by cooking, typically falling under the 'bean (whole or pieces)' category and consumed as is or in recipes.)
("entity"|||Bean|||Category|||A broad term that encompasses various edible legumes, including jack bean, velvet bean, and chickpea, often used as the base for many food products.)
("entity"|||Bean (Dried)|||Ingredient|||A form of bean that is preserved in a dehydrated state, commonly used in long-storage or bulk cooking contexts before rehydration and preparation.)
("entity"|||Broad Bean|||Ingredient|||A type of legume used in a wide range of culinary applications; also serves as the basis for broad bean food products.)

######################
-Real Data-
######################
Title: {title}
Text: {text}
######################
Output:'''


entity_extraction_customized_example_string = '''\
######################
-Example-
######################
Input:
Title: {title}
Text: {text}
######################
Output:
{example_output}'''


entity_extraction_customized_examples_prompt = '''\
You are assisting in the construction of a domain-specific ontology by extracting meaningful entities from text.
Each entity should represent a concept relevant to the domain, including both general categories (e.g., "Bean") and specific subtypes (e.g., "Bean (Dried)").
Note that entities can overlap conceptually or hierarchically — do not exclude broader or more abstract terms just because more specific variants also appear.

Given a document, extract important domain terms (entities) and assign each one a generalized type, such as Concept, Process, Unit, Method, Material, Organism, Product, Ingredient, Category, etc.
For each identified entity, extract the following information:
- entity_name: Name of the entity
- entity_type: Type of the entity
- entity_description: Comprehensive description of the entity's attributes and activities
Format each entity as ("entity"|||<entity_name>|||<entity_type>|||<entity_description>)

{examples_string}

######################
-Real Data-
######################
Title: {title}
Text: {text}
######################
Output:'''


plain_classification_prompt_engineering = '''\
You are assisting in the construction of a domain-specific ontology in the field of engineering by classifying entities into one of the following categories: specific term and category type. Each entity is provided along with a brief description, extracted from domain-specific documents. Classify each entity accordingly, and use your understanding of engineering semantics, units, and measurement systems to guide your decisions.

Definitions:
- A specific term refers to a concrete value, expression, or unit used in engineering contexts. These are often numerical ranges (e.g., "0–5"), quantified values (e.g., "54.3584 on the Kelvin scale"), or precise technical expressions (e.g., "British thermal unit (39 °F)", "centiwatt").
- A category type is a broader engineering concept or unit class that generalizes over multiple specific terms. For example, "energy unit" may include "kilojoule", "calorie", or "British thermal unit", while "temperature scale" may include "Kelvin" or "Celsius".

######################
-Example-
######################
Input:
yard (international): A unit of length equal to 0.9144 meters, widely used in sports, construction, and everyday measurements.
fillet: A unit of volume or weight used in the food industry, particularly in the context of fish or meat portions.
electric field: A vector field that describes the force per unit charge exerted on a test charge at a given point in space, measured in newtons per coulomb.
v magnitude: A magnitude measurement in astronomy that corresponds to the V band filter, used to quantify the brightness of an object in the visible (green-yellow) part of the spectrum.
######################
Output:
[
  {{
    "entity": "yard (international)",
    "classification": "term"
  }},
  {{
    "entity": "fillet",
    "classification": "term"
  }},
  {{
    "entity": "electric field",
    "classification": "type"
  }},
  {{
    "entity": "v magnitude",
    "classification": "type"
  }}
]
######################
-Real Data-
######################
Input:
{list_of_entities_with_description}
######################
Output:'''


plain_classification_prompt_scholarly = '''\
You are assisting in the construction of a domain-specific ontology in the field of scholarly by classifying entities into one of the following categories: specific term and category type. Each entity is provided along with a brief description, extracted from domain-specific documents. Classify each entity accordingly, and use your understanding of scholarly semantics to guide your decisions.

Definitions:
- Specific Term: A labeled unit used in linguistic annotations, lexicons, or terminology systems. It often represents a concrete value, morphological feature, or syntactic role. Examples: "vocative case", "slang register", "reflexive personal pronoun", "comma".
- Category Type: A general class that organizes multiple specific terms into a shared structural or grammatical role. It may represent parts of speech, syntactic frames, semantic roles, or annotation dimensions. Examples: "case", "register", "verb frame", "pronoun", "punctuation".

Note: Some entities can validly belong to both categories depending on the context. For example:
- "pronoun" can be considered a type (e.g., parent of "personal pronoun", "reflexive pronoun"), and also a term when used as a general tag in part-of-speech tagging.
- "comma" is a specific punctuation mark, but also serves as a type when it functions as a category in punctuation schemas.

######################
-Example-
######################
Input:
pronoun: A part of speech that replaces nouns and refers to people, places, or things, including types such as relative, reflexive, and emphatic pronouns.
pronoun: A part of speech that replaces nouns to avoid repetition, and refers to people, places, or things.
pronoun: A category of words that refer to nouns, often used to replace them in sentences to avoid repetition and enhance clarity.
######################
Output:
[
  {{
    "entity": "pronoun",
    "classification": "type"
  }},
  {{
    "entity": "pronoun",
    "classification": "term"
  }},
  {{
    "entity": "pronoun",
    "classification": "type"
  }}
]
######################
-Real Data-
######################
Input:
{list_of_entities_with_description}
######################
Output:'''


plain_classification_customized_example_string = '''\
######################
-Example-
######################
Input:
#### Title
{title}
#### Text
{text}
#### List of Entities
{entities}
######################
Output:
{example_output}'''


plain_classification_engineering_customized_examples_prompt = '''\
You are assisting in the construction of a domain-specific ontology in the field of engineering. Given a document containing engineering-related text and a list of extracted entities from the document, your task is to determine whether each entity represents a term or a type. 

A specific term refers to a concrete value, expression, or unit used in engineering contexts. These are often numerical ranges (e.g., "0–5"), quantified values (e.g., "54.3584 on the Kelvin scale"), or precise technical expressions (e.g., "British thermal unit (39 °F)", "centiwatt"). A category type is a broader engineering concept or unit class that generalizes over multiple specific terms. For example, "energy unit" may include "kilojoule", "calorie", or "British thermal unit", while "temperature scale" may include "Kelvin" or "Celsius".

Use the surrounding context in the document to inform your classification. Watch for semantic cues that may indicate hierarchical or definitional relationships. These include keywords and phrases such as "is a type of", "categorized as", "classified under", "a subtype of", "includes", "consists of". These expressions can signal important contextual clues — when they appear near an entity, use extra caution in interpreting whether it represents a specific term or a general type.

Apply your understanding of engineering semantics, units, and classification logic to make accurate distinctions. If an entity could logically be both depending on context, classify it based on how it appears to function in this document. Your output should be a list of classifications in the following format:
<entity_name>|||<entity_classification>
Where <entity_classification> is either term or type.

{examples_string}

######################
-Real Data-
######################
Input
#### Title
{title}
#### Text
{text}
#### List of Entities
{entities}
######################
Output:'''


plain_classification_scholarly_customized_examples_prompt = '''\
You are assisting in the construction of a domain-specific ontology in the field of linguistics. Given a document containing linguistics-related text and a list of extracted entities from the document, your task is to determine whether each entity represents a term or a type. 

Use the surrounding context in the document to inform your classification. Watch for semantic cues that may indicate hierarchical or definitional relationships. These include keywords and phrases such as "is a type of", "categorized as", "classified under", "a subtype of", "includes", "consists of". These expressions can signal important contextual clues — when they appear near an entity, use extra caution in interpreting whether it represents a specific term or a general type.

Apply your understanding of linguistics semantics and classification logic to make accurate distinctions. If an entity could logically be both depending on context, classify it based on how it appears to function in this document. Your output should be a list of classifications in the following format:
<entity_name>|||<entity_classification>
Where <entity_classification> is either term or type.

{examples_string}

######################
-Real Data-
######################
Input
#### Title
{title}
#### Text
{text}
#### List of Entities
{entities}
######################
Output:'''