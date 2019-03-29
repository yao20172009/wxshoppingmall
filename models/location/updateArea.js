function UpdateArea(input) {
  return {
    query: `mutation updateArea($input:UpdateAreaInput!){
      updateArea(input:$input){
        clientMutationId
        status
      }
    }`,
    variables: {
      input:input,
    }
  }
}

module.exports = {
  UpdateArea
};