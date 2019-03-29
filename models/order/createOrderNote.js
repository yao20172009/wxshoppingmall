function CreateOrderNote(input) {
  return {
    operationName: "createOrderNote",
    query: `mutation createOrderNote
      ($input: CreateOrderNoteInput!){
      createOrderNote(input:$input){
        clientMutationId
        orderNote{
          id
          user{
            id
            name
            avatar
          }
          content
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateOrderNote
};