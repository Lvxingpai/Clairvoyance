Template.services.helpers({
    services: function () {
        if ($('.footable').length > 0){
            Meteor.setTimeout(function(){
                $('.footable').trigger('footable_initialize');
            }, 1000);
        };
        return config.db.Service.find({}).fetch();
    }
})

Template.services.onRendered(function () {
    $('.footable').footable();
})

Template.services.events({
    // 设置报警弹层
    'click .glyphicon-bell': function () {
        $('.alarm-layer').parents('.modal').remove();
        var self = this;
        var isChecked = '';
        var alert = {};
        if (this.alert){
            var alert = this.alert;
            var policy = alert.policy;
            if (alert.ping && alert.ping.validation && alert.ping.validation.should){
                alert.ping.validation.rules = _.map(alert.ping.validation.should, function(should){
                    var temp = {};
                    temp[should.key] = should.value;
                    return temp;
                });
                alert.ping.validation.rules = JSON.stringify(alert.ping.validation.rules);
            };
            isChecked = 'checked';
        }
        alert.policyList = _.map(config.db.AlertPolicy.find({}).fetch(), function (alertPolicy) {
            return _.extend(alertPolicy, {
                isChecked: (alertPolicy.name === policy) ? 'checked' : ''
            });
        });

        var shareDialogInfo = {
            template: Template.alarmLayer,
            title: '服务的报警器设置',
            buttons: {
                "save": {
                    class: 'btn-info',
                    label: 'Save'
                }
            },
            doc: {
                hasAlert: isChecked,
                alert: alert
            }
        };
        layerManager.alarmLayer = ReactiveModal.initDialog(shareDialogInfo);
        layerManager.alarmLayer.show();
        layerManager.alarmLayer.buttons.save.on('click', function(button){
            var serviceValidationRules = $('#serviceValidationRules').val();
            serviceValidationRules = _.map(JSON.parse(serviceValidationRules), function(rule){
                rule = _.pairs(rule);
                return {
                    key: rule[0][0],
                    value: rule[0][1]
                }
            });
            var serviceAlert = {
                interval: $('#serviceInterval').val(),
                minNodeCount: $('#serviceMinimalNodes').val(),
                policy: $("#serviceAlertpolicy").find("option:selected").text(),
                ping: {
                    type: $('#servicePingType').val(),
                    entrypoint: $('#serviceEntrypoint').val(),
                    port: $('#servicePingPort').val(),
                    validation: {
                        type: $('#serviceValidationType').val(),
                        should: serviceValidationRules
                    }
                }
            };
            Meteor.call('service.setAlertPolicy', self.name, serviceAlert, function(err, res){
                if (err){
                    console.log(err);
                    swal("Oops!", "Something went wrong on the page!", "error");
                    return ;
                };
                if (res.status){
                    swal("Success!", "...", "success");
                    return ;
                };
                //if (res.status === false){
                //    swal(res.data.title, res.data.desc, "error");
                //    return ;
                //};
                swal("Oops!", "Something went wrong on the page!", "error");
            });
        });
    },

    // 添加服务
    'click #addService': function (e) {
        $('.create-service-layer').parents('.modal').remove();
        var shareDialogInfo = {
            template: Template.createServiceLayer,
            title: '添加服务监控',
            buttons: {
                "add": {
                    class: 'btn-info',
                    label: 'Add'
                }
            },
            doc: {}
        };
        layerManager.createServiceLayer = ReactiveModal.initDialog(shareDialogInfo);
        layerManager.createServiceLayer.show();
        Meteor.setTimeout("$('.create-service-layer input.service-name').focus();", 500);
        layerManager.createServiceLayer.buttons.add.on('click', function(button){
            var service = {
                name: $('.create-service-layer .service-name').val(),
                description: $('.create-service-layer .service-description').val()
            };

            Meteor.call('service.addService', service, function(err, res){
                if (err){
                    console.log(err);
                    swal("Oops!", "Something went wrong on the page!", "error");
                    return ;
                };
                if (res.status){
                    swal("Success!", "Add the service: " + service.name, "success");
                    return ;
                };
                if (res.status === false){
                    swal(res.data.title, res.data.desc, "error");
                    return ;
                };
                swal("Oops!", "Something went wrong on the page!", "error");
            });
        });
    },

    // 删除服务
    'click #deleteService': function (e) {
        $('.delete-service-layer').parents('.modal').remove();
        var shareDialogInfo = {
            template: Template.deleteServiceLayer,
            title: '删除服务监控',
            buttons: {
                "delete": {
                    class: 'btn-danger',
                    label: 'Delete'
                }
            },
            doc: {}
        };
        layerManager.deleteServiceLayer = ReactiveModal.initDialog(shareDialogInfo);
        layerManager.deleteServiceLayer.show();
        Meteor.setTimeout("$('.delete-service-layer input.service-name').focus();", 500);
        layerManager.deleteServiceLayer.buttons.delete.on('click', function(button){
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this service monitor!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function(){
                var service = {
                    name: $('.delete-service-layer .service-name').val()
                };
                Meteor.call('service.deleteService', service, function(err, res){
                    if (err){
                        console.log(err);
                        swal("Oops!", "Something went wrong on the page!", "error");
                        return ;
                    };
                    if (res.status){
                        swal("Deleted!", "The service " + service.name + "has been deleted", "success");
                        return ;
                    };
                    if (res.status === false){
                        swal(res.data.title, res.data.desc, "error");
                        return ;
                    };
                    swal("Oops!", "Something went wrong on the page!", "error");
                });
            });
        });
    },
})