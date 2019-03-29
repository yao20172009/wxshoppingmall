const UnawarePointChanges = {
  query: `query {
    unawarePointChanges{
      id
      items{
        supplier{
          id
          name
        }
        points
      }
    }
  }`
}

function AwareAllPointChanges(input) {
  return {
    operationName: "awareAllPointChanges",
      query: `mutation awareAllPointChanges($input:AwareAllPointChangesInput!){
      awareAllPointChanges(input:$input){
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
  UnawarePointChanges,
  AwareAllPointChanges
};