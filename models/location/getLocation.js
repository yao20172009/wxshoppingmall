function GetLocation(latitude, longitude) {
  return {
    query: `query($latitude: String!, $longitude: String!) {
      areaHit(latitude: $latitude, longitude: $longitude) {
        fullName
        id
        code
        name
      }
    }`,
    variables: {
      clientMutationId: 0,
      latitude: latitude, //每次取多少条
      longitude: longitude,
    }
  }
}

module.exports = {
  GetLocation
};