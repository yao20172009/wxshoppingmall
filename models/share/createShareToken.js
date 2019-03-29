function CreateShareToken(input) {
  return {
    operationName: "createShareToken",
        query: `mutation createShareToken($input:CreateShareTokenInput!){
      createShareToken(input:$input){
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
  CreateShareToken
};