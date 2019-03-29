function ReadSupplierShareNotify(input) {
  return {
    operationName: "readSupplierShareNotify",
    query: `mutation readSupplierShareNotify($input:ReadSupplierShareNotifyInput!){
      readSupplierShareNotify(input:$input){
        status
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  ReadSupplierShareNotify
};