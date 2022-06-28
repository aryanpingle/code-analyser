const { EMPTY_STRING } = require("./constants");
const {
  getAllSubPartsOfGivenAbsolutePath,
  resolveAddressWithProvidedDirectory,
  getFileNameFromElement,
} = require("./resolver");

/**
 * Will build a trie based on the given
 * @param {Array} filesObjectsArray
 * @returns Trie containing information related to paths of all files given in the array
 */
const buildTrie = (filesObjectsArray) => {
  const headNode = getNewTrieNode(EMPTY_STRING);

  filesObjectsArray.forEach((fileElement) => {
    const fileName = getFileNameFromElement(fileElement);
    const fileSubParts = getAllSubPartsOfGivenAbsolutePath(fileName);
    let nodeToTraverse = headNode;
    fileSubParts.forEach((subPart, index) => {
      if (index === 0) return;
      if (!nodeToTraverse.childrens[subPart]) {
        const pathTillNode = resolveAddressWithProvidedDirectory(
          nodeToTraverse.pathTillNode,
          subPart
        ).trim();
        nodeToTraverse.childrens[subPart] = getNewTrieNode(
          subPart,
          pathTillNode,
          index + 1 === fileSubParts.length
        );
      }
      nodeToTraverse = nodeToTraverse.childrens[subPart];
    });
  });
  return headNode;
};

const getNewTrieNode = (baseName, pathTillNode = " ", isFile = false) => {
  return {
    baseName,
    pathTillNode,
    childrens: {},
    isFile,
  };
};

/**
 * Will be used to ignore nodes which have just one children to allow faster parsing of the trie
 * @param {Object} givenNode
 * @returns Trie node containing zero or more than one childrens
 */
const getFirstNodeNotContainingOneChild = (givenNode) => {
  let nodeToTraverse = givenNode;
  while (Object.keys(nodeToTraverse.childrens).length === 1) {
    nodeToTraverse =
      nodeToTraverse.childrens[Object.keys(nodeToTraverse.childrens)[0]];
  }
  return nodeToTraverse;
};

module.exports = {
  buildTrie,
  getFirstNodeNotContainingOneChild,
};
