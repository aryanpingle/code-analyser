/**
 * Returns all individual properties present in a x.y.z or x["y"]["z"] type statements
 * Eg. for the above case, will return [x, y, z]
 * @param {Object} node AST node where this statement was encountered
 * @returns Array containing the parsed properties
 */
const getAllPropertiesFromNode = (node) => {
  const allPropertiesArray = [];
  let headNode = node;
  let typeToCheck, childPropertyToCheck, nodePropertyToCheck;
  // Used inside TS interfaces
  if (headNode.type === "TSQualifiedName") {
    typeToCheck = "TSQualifiedName";
    childPropertyToCheck = "left";
    nodePropertyToCheck = "right";
  } else {
    typeToCheck = "MemberExpression";
    childPropertyToCheck = "object";
    nodePropertyToCheck = "property";
  }
  // while there still exists more than one property
  while (headNode && headNode.type === typeToCheck) {
    allPropertiesArray.unshift(headNode[nodePropertyToCheck].name);
    headNode = headNode[childPropertyToCheck];
  }
  // The last property accessed
  allPropertiesArray.unshift(headNode.name);

  return allPropertiesArray;
};

module.exports = { getAllPropertiesFromNode };
