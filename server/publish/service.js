var Service = config.db.Service;

Meteor.publish("serviceList", function () {
  return Service.find({});
});
