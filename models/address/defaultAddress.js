const DefaultAddress = {
  query: `query {
    viewer {
      defaultAddress {
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
  DefaultAddress
};