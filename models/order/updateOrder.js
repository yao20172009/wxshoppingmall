function UpdateOrder(input) {
  return {
    operationName: "updateOrder",
    query: `mutation updateOrder($input: UpdateOrderInput!) {
      updateOrder(input:$input){
        clientMutationId
        order{
          id
          confirmed
          note
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

function UpdateOrderRate(input) {
  return {
    operationName: "updateOrderRate",
    query: `mutation updateOrderRate($input:UpdateOrderRateInput!){
      updateOrderRate(input:$input){
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
  UpdateOrder,
  UpdateOrderRate
};