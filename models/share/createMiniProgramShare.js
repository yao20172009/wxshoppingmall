function CreateMiniProgramShare(input) {
  return {
    operationName: "createMiniProgramShare",
    query: `mutation createMiniProgramShare($input:CreateMiniProgramShareInput!){
      createMiniProgramShare(input:$input){
        clientMutationId
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateMiniProgramShare
};