function DeleteOrderCancelApplication(input) {
  return {
    operationName: "deleteOrderCancelApplication",
    query: `mutation deleteOrderCancelApplication
      ($input: DeleteOrderCancelApplicationInput!){
      deleteOrderCancelApplication(input:$input){
        clientMutationId
        status
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  DeleteOrderCancelApplication
};