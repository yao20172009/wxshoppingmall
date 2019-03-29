function Like(input) {
  return {
    operationName: "like",
    query: `mutation like($input:LikeInput!){
      like(input:$input){
        status
        clientMutationId
      }
    }`,
    variables: {
      input: input
    }
  }
}

function Unlike(input) {
  return {
    operationName: "unlike",
    query: `mutation unlike($input:UnlikeInput!){
      unlike(input:$input){
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
  Like,
  Unlike
};