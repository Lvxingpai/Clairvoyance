var Service = config.db.Service;
Meteor.publish("serviceList", function () {
    return Service.find({});
});

Meteor.methods({
    'service.addService': function(service){
        check(service, Object);
        if (Service.findOne({'name': service.name})){
            console.log('err1');
            return {
                status: false,
                data: {
                    title: 'Reduplicate name!',
                    desc: "The service " + service.name + " already exists"
                }
            };
        };
        var service = {
            name: service.name,
            desc: service.description,
            alert: {
                interval : 60,
                policy : "default",
                ping : {
                    type : "http",
                    entrypoint : "/_ping",
                    validation : {
                        type : "json",
                        should : [
                            {
                                key : "ack",
                                value : "pong"
                            }
                        ]
                    }
                }
            }
        };
        Service.insert(service);
        var res = AlarmManager.createAlarm(service);
        if (! res) {
            return {
                status: false,
                data: {
                    title: 'Failed!',
                    desc: '...'
                }
            }
        };
        return {
            status: true
        };
    },

    'service.deleteService': function(service){
        check(service, Object);
        if (! Service.findOne({'name': service.name})){
            return {
                status: false,
                data: {
                    title: 'Unknown service!',
                    desc: "The service " + service.name + " dosen't exist"
                }
            };
        };

        // 不能用回调,因为client端在等待响应
        var res = Meteor.call('alarm.deleteAlarm', service);
        if (!res) {
            return {
                status: false,
                data: {
                    title: 'Failed!',
                    desc: '...'
                }
            }
        }
        Service.remove({
            name: service.name
        });
        return {
            status: true
        }
    },

    'service.setAlertPolicy': function(serviceName, serviceAlert){
        check(serviceName, String);
        check(serviceAlert, Object);
        Service.update({'name': serviceName}, {$set: {alert: serviceAlert}}, {upsert: true});
        return {
            status: true
        };
    }
})