export type Skill = { id: string; name: string };
export type PrimaryClass = { id: string; name: string; skills: Skill[] };
export type Section = { id: "english" | "math"; name: string; classes: PrimaryClass[] };

export const sections: Section[] = [
  {
    id: "english",
    name: "Reading & Writing",
    classes: [
      {
        id: "information-ideas",
        name: "Information and Ideas",
        skills: [
          { id: "central-ideas", name: "Central Ideas and Details" },
          { id: "command-of-evidence", name: "Command of Evidence" },
          { id: "inferences", name: "Inferences" },
        ],
      },
      {
        id: "craft-structure",
        name: "Craft and Structure",
        skills: [
          { id: "words-in-context", name: "Words in Context" },
          { id: "text-structure", name: "Text Structure and Purpose" },
          { id: "cross-text", name: "Cross-Text Connections" },
        ],
      },
      {
        id: "expression-ideas",
        name: "Expression of Ideas",
        skills: [
          { id: "rhetorical-synthesis", name: "Rhetorical Synthesis" },
          { id: "transitions", name: "Transitions" },
        ],
      },
      {
        id: "standard-english",
        name: "Standard English Conventions",
        skills: [
          { id: "boundaries", name: "Boundaries" },
          { id: "form-structure", name: "Form, Structure, and Sense" },
        ],
      },
    ],
  },
  {
    id: "math",
    name: "Math",
    classes: [
      {
        id: "algebra",
        name: "Algebra",
        skills: [
          { id: "linear-eq-1var", name: "Linear equations in one variable" },
          { id: "linear-eq-2var", name: "Linear equations in two variables" },
          { id: "linear-functions", name: "Linear functions" },
          { id: "systems", name: "Systems of two linear equations" },
          { id: "linear-inequalities", name: "Linear inequalities" },
        ],
      },
      {
        id: "advanced-math",
        name: "Advanced Math",
        skills: [
          { id: "nonlinear-functions", name: "Nonlinear functions" },
          { id: "nonlinear-eq", name: "Nonlinear equations and systems" },
          { id: "equivalent-expr", name: "Equivalent expressions" },
        ],
      },
      {
        id: "problem-solving",
        name: "Problem-Solving and Data Analysis",
        skills: [
          { id: "ratios-rates", name: "Ratios, rates, proportions" },
          { id: "percentages", name: "Percentages" },
          { id: "distributions", name: "Distributions and measures" },
          { id: "probability", name: "Probability" },
        ],
      },
      {
        id: "geometry-trig",
        name: "Geometry and Trigonometry",
        skills: [
          { id: "area-volume", name: "Area and volume" },
          { id: "lines-angles", name: "Lines, angles, and triangles" },
          { id: "right-triangles", name: "Right triangles and trigonometry" },
          { id: "circles", name: "Circles" },
        ],
      },
    ],
  },
];

export type FilterSelection = {
  section: "english" | "math";
  classes: Record<string, boolean>;
  skills: Record<string, boolean>;
};
