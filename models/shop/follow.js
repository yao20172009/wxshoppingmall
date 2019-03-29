function Follow(input) {
  return {
    // operationName: "follow",
    query: `mutation follow($input:FollowInput!){
      follow(input:$input){
        clientMutationId
        status
        rewardPoints
        wxCardLists{
          cardId
          cardExt
        }
      }
    }`,
    variables: {
      input: input
    }
  }
};

function Unfollow(input) {
  return {
    query: `mutation unfollow($input:UnfollowInput!){
      unfollow(input:$input){
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
  Follow,
  Unfollow
};