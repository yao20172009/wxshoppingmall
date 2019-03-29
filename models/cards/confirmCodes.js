function ConfirmCodes(input) {
  return {
    query: `mutation confirmCodes($input:ConfirmCodeInput!){
      confirmCodes(input:$input){
        status
        clientMutationId
      }
    }`,
    variables: {
      input:input
    }
  }
}

module.exports = {
  ConfirmCodes
};