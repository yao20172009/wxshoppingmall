function createFeedback(input) {
  return {
    operationName: "createFeedback",
    query: `mutation createFeedback ($input: CreateFeedbackInput!){
      createFeedback(input:$input){
        feedback {
          id
          title
          contact
          content
        }
        clientMutationId
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  createFeedback
};