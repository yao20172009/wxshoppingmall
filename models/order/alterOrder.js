function AlterOrder(input) {
  return {
    // operationName: "alterOrder",
    query: `mutation alterOrder($input:AlterOrderInput!){
      alterOrder(input:$input){
        clientMutationId
        order{
          id
          status
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  AlterOrder
};