const Address = {
  query: `query {
    viewer {
      addresses {
        id
        province
        city
        county
        phone
        receiver
        road
        default
      }
    }
  }`,

  // linkMan, mobile, selProvince, selCity, selDistrict, address, code
  variables: {
  }
}

module.exports = {
  Address
};