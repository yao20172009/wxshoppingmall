const GetAreaId = {
  query: `query {
    viewer {
      area {
        id
        name
        fullName
      }
    }
  }`
}

module.exports = {
  GetAreaId
};