function CreateOrderCancelApplication(input) {
  return {
    operationName: "createOrderCancelApplication",
    query: `mutation createOrderCancelApplication
      ($input: CreateOrderCancelApplicationInput!){
      createOrderCancelApplication(input:$input){
        clientMutationId
        orderCancelApplication{
          id
          reason
          status
          statusDesc
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateOrderCancelApplication
};