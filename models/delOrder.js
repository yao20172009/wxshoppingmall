function DelOrder(input) {
  return {
    operationName: "deleteOrder",
    query: `mutation deleteOrder ($input:OrderDeleteInput!){
      deleteOrder(input:$input){
        clientMutationId
        success
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  DelOrder
};