const GetAreas = {
  query: `query {
    areas {
      edges {
        node {
          id
          name
          fullName
          code
        }
      }
    }
  }`
}

module.exports = {
  GetAreas
};