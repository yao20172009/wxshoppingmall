function CreateOrderRate(input) {
  return {
    operationName: "createOrderRate",
    query: `mutation createOrderRate($input:CreateOrderRateInput!){
      createOrderRate(input:$input){
        status
        clientMutationId
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateOrderRate
};