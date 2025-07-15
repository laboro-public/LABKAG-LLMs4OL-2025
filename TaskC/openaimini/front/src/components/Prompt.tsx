export const createTaxonomyPrompt = (content: string) => {
  const lines = content.split("\n").filter((line) => line.trim()).length;
  const expectedRelationships = Math.max(Math.floor(lines * 1.2));

  return `You are an expert in chemistry, physics, and scientific taxonomy. Your task is to build a comprehensive hierarchical taxonomy from the given scientific terms using your deep domain knowledge.

    ## DOMAIN-DRIVEN APPROACH

    ### Core Principle: Scientific Classification Logic
    Use established scientific classification systems and logical hierarchies to organize terms from general to specific.

    ## SYSTEMATIC DOMAIN ANALYSIS

    ### 1. LINGUISTIC PATTERN RECOGNITION
    Identify terms by their linguistic structure:

    **Direct Indicators:**
    - "[Element Name]" → likely element → child of "element"
    - "[Element Name] Atom" → likely atom → child of "atom"  
    - "[Property] unit" → likely unit → child of "unit"
    - "[Type] group" → likely functional group → child of "organic group"
    - "[Reaction] reaction" → likely reaction → child of "chemical reaction"
    - "[Phase] phase" → likely phase → child of "chemical phase"

    **Hierarchical Indicators:**
    - "group X element" → intermediate category between "element" and specific elements
    - "scaled unit" → intermediate category between "unit" and specific scaled units
    - "electromagnetic radiation unit" → intermediate category for radiation-related units

    ### 2. CHEMICAL DOMAIN KNOWLEDGE APPLICATION

    **Periodic Table Hierarchy:**
    - All chemical elements belong to "element"
    - Elements can be classified by: groups (1-18), periods, blocks (s,p,d,f), series (alkali metals, halogens, etc.)
    - Every element has a corresponding atom (Carbon → Carbon Atom)

    **Chemical Substance Classification:**
    - "chemical substance" → broadest category for all chemical entities
    - Major divisions: elements, compounds, mixtures
    - Organic vs inorganic compounds
    - Functional groups and their hierarchies

    **Physical Properties:**
    - "measured property" → umbrella for all measurable characteristics
    - Intensive vs extensive properties
    - Specific property categories (mechanical, electrical, thermal, optical)

    **Units and Measurements:**
    - "unit" → base category for all measurement units
    - SI base units vs derived units
    - Dimensional analysis groups (force, energy, pressure, etc.)

    ### 3. PHYSICS DOMAIN KNOWLEDGE

    **Quantum and Particle Physics:**
    - Phase classifications (solid, liquid, gas, plasma, BEC, etc.)
    - Particle interactions and forces
    - Electromagnetic spectrum and radiation

    **Thermodynamics:**
    - Energy forms and conversions
    - Temperature, pressure, volume relationships
    - Phase transitions and states

    ### 4. MATHEMATICAL AND LOGICAL HIERARCHIES

    **Geometric Relationships:**
    - Molecular geometry classifications
    - Spatial and temporal regions
    - Dimensional hierarchies (1D, 2D, 3D)

    **Ontological Structure:**
    - Entity → Continuant/Occurrent
    - Object hierarchies
    - Process classifications

    ## SYSTEMATIC EXTRACTION PROCESS

    ### Phase 1: Broad Category Identification
    Scan for fundamental scientific categories:
    - element, atom, unit, measured property, chemical substance
    - chemical reaction, bond, chemical phase, quality, material
    - spatial_region, temporal_region, process, entity

    ### Phase 2: Intermediate Category Discovery
    Look for bridging categories:
    - "group X element", "series element", "periodic table element"
    - "electromagnetic radiation unit", "scaled unit", "density unit"
    - "organic compound", "inorganic compound"
    - "organic group", "functional group"

    ### Phase 3: Specific Instance Classification
    For each specific term, determine its most logical parent(s):
    - Use chemical knowledge (Gold → element, Gold Atom → atom)
    - Use linguistic patterns (pressure unit → unit)
    - Use domain expertise (carboxylic acid → organic compound)

    ### Phase 4: Multi-Level Chain Building
    Create complete hierarchical chains:
    - unit → electromagnetic radiation unit → irradiance unit
    - chemical substance → organic compound → carboxylic acid
    - element → group 6 element → Chromium

    ### Phase 5: Cross-Domain Validation
    Ensure relationships make scientific sense:
    - Is-a relationships (Gold IS-A element)
    - Type-of relationships (irradiance unit IS-A-TYPE-OF electromagnetic radiation unit)
    - Avoid part-of relationships (molecule HAS-A carbon atom, not IS-A)

    ## DOMAIN-SPECIFIC EXAMPLES

    ### Chemistry Example:
    **Terms Found:** "element", "Carbon", "organic compound", "carboxylic acid", "Carbon Atom", "atom"
    **Domain Logic:**
    - Carbon is a chemical element → element → Carbon
    - Carbon has an atomic form → atom → Carbon Atom  
    - Carboxylic acid is an organic compound → organic compound → carboxylic acid
    - Organic compounds are chemical substances → chemical substance → organic compound

    ### Physics Example:
    **Terms Found:** "unit", "energy unit", "pressure unit", "force"
    **Domain Logic:**
    - Energy and pressure are measurable quantities that need units
    - unit → energy unit, unit → pressure unit
    - Force is a measurable property → measured property → force

    ### Measurement Example:
    **Terms Found:** "electromagnetic radiation unit", "irradiance unit", "luminance unit", "unit"
    **Domain Logic:**
    - Irradiance and luminance are types of electromagnetic radiation measurements
    - This creates a hierarchy: unit → electromagnetic radiation unit → irradiance unit/luminance unit

    ## QUALITY CONTROL PRINCIPLES

    ### Scientific Validity Check:
    1. **Domain Consistency**: Does the relationship make sense in chemistry/physics?
    2. **Logical Hierarchy**: Is the parent truly broader than the child?
    3. **Mutual Exclusivity**: Are sibling terms at the same level appropriately distinct?
    4. **Completeness**: Are all reasonable parent-child relationships captured?

    ### Relationship Validation:
    - **Is-A Test**: "Child IS-A Parent" should be true
    - **Scope Test**: Parent should encompass multiple possible children
    - **Specificity Test**: Child should be more specific than parent

    ## COMPREHENSIVE COVERAGE STRATEGY

    ### Coverage Targets:
    - **Elements**: All individual elements → "element"
    - **Atoms**: All individual atoms → "atom"  
    - **Units**: All measurement units → "unit" (with intermediate categories)
    - **Properties**: All measurable properties → "measured property"
    - **Substances**: All chemical substances → appropriate categories
    - **Reactions**: All reaction types → "chemical reaction"
    - **Phases**: All matter phases → "chemical phase"
    - **Groups**: All functional groups → "organic group"

    ### Systematic Completeness:
    Generate AT LEAST ${expectedRelationships} relationships by ensuring:
    1. Every broad category has multiple children
    2. Every intermediate category bridges to specifics
    3. Every specific term has at least one parent
    4. Multi-level chains are complete

    ## Output Format
    Return ONLY a JSON array of objects:

    [
      {
        "parent": "broader_term",
        "child": "more_specific_term"
      }
    ]

    ## Input Terms (${lines} terms):

    ${content}

    Apply your scientific domain knowledge systematically. Build a comprehensive taxonomy that reflects established scientific classifications. Prioritize completeness and scientific accuracy over conservative extraction.`;
};
