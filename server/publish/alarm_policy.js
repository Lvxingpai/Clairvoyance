/**
 * Created by apple on 15-9-22.
 */
Meteor.publish("alertPolicyList", function () {
    return DB.AlertPolicy.find({});
});
