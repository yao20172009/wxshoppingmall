function CurrentPromotion(areaId) {
  return {
    query: `query currentPromotion($areaId:String){
      currentTime
      currentPromotion(areaId:$areaId)  {
        id
        no
        name
        desc
        startTime
        endTime
        code
        imageUrl
        styles
      }
      nextPromotion(areaId:$areaId)  {
        id
        no
        name
        desc
        startTime
        endTime
        code
        imageUrl
        styles
      }
  }`,
    variables: {
      areaId: areaId,
    }
  }
}

module.exports = {
  CurrentPromotion,
}