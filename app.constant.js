module.exports = {
  adminPermissionLevel: {
    admin: 1,
    appTeam: 2,
    client: 3,
  },
  keywordCheckFrequency: {
    daily: 0,
    weekly: 1,
    fortnightly: 2,
    monthly: 3,
  },
  locationCode: {
    melbourne: 1000567,
    adelaide: 1000422,
    sydney: 1000286,
    brisbane: 1000339,
    perth: 1000676,
    canberra: 1000142,
    hobart: 1000480,
    philippines: 2608,
  },
  email_template: {
    account_created_mail: "Your account is created successfully !!",
    password_reset: "Your password reset request",
    new_rank_update_alert: "New rank has been updated !!",
  },
  team_name: "Akvitek Team",
  locationArray: [
    { locationCode: 1000567, locationName: "Melbourne" },
    { locationCode: 1000422, locationName: "adelaide" },
    { locationCode: 1000286, locationName: "sydney" },
    { locationCode: 1000339, locationName: "brisbane" },
    { locationCode: 1000676, locationName: "perth" },
    { locationCode: 1000142, locationName: "canberra" },
    { locationCode: 1000480, locationName: "hobart" },
    { locationCode: 2608, locationName: "philippines" },
  ],
};
