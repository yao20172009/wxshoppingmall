function CreateOrder(input) {
  return {
    operationName: "createOrder",
    query: `mutation createOrder($input: CreateOrderInput!){
      createOrder(input:$input){
        clientMutationId
        order{
          no
          id
          status
          weixinpayParams
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateOrder
};