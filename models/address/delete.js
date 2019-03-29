function DeleteAddress(input) {
  return {
    operationName:"deleteAddress",
    query: `mutation deleteAddress ($input:DeleteAddressInput!){
      deleteAddress(input:$input){
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
  DeleteAddress
};