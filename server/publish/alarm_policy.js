/**
 * Created by apple on 15-9-22.
 */

var AlertPolicy = config.db.AlertPolicy;
Meteor.publish("alertPolicyList", function () {
    return AlertPolicy.find({});
});
