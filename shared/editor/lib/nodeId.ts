import randomstring from "randomstring";

// Generate a unique id for editor nodes.
// Global object makes it easy to use across function and class component.
const nodeIds = new Set<string>();

export const getNodeId = (attemptLeft = 3): string => {
  const id = randomstring.generate(10);
  if (nodeIds.has(id) && attemptLeft > 1) {
    return getNodeId(attemptLeft - 1);
  }
  // collision chances are minimal after three attempts,
  // return the id either way.
  nodeIds.add(id);
  return id;
};
