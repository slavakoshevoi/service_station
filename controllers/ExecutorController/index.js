"use strict";

const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');
const TransportType = require('../../models/TransportType');
const Request = require('../../models/Request');
const User = require('../../models/User');
const formatDate = require('../../helpers/formatDate');
const countEndTime = require('../../helpers/countEndTime');
const validation = require('../../middleware/validation');
const status = require('../../constants/status');
const Models = require('../../models/TaskDetail/relations');

router.get('/tasks/:status', (req, res) => {
    let findBy;
    if (req.params.status === 'all') {
        findBy =  {
            status:{
                $between: [1, 5]
            },
            planedExecutorID: req.session.passport.user.id
        }
    }
    else if (req.params.status === 'hold') {
        findBy = {
            status:status.HOLD,
            planedExecutorID: req.session.passport.user.id,
        }
    }
    else if (req.params.status === 'processing'){
        findBy = {
            status: status.PROCESSING,
            planedExecutorID: req.session.passport.user.id,
        }
    }
    else if (req.params.status === 'done'){
        findBy ={
            status: status.DONE,
            planedExecutorID: req.session.passport.user.id,
        }
    }
    Task
        .getTaskByExecutorId(findBy)
        .then(result => {
            for (var i = 0; i < result.length; i++) {
                result[i].dataValues.startTime = formatDate(result[i].dataValues.startTime);
                result[i].dataValues.endTime = formatDate(result[i].dataValues.endTime);
            }

            User
                .getAllUsers()
                .then(users => {
                    User.getUserById(result[0].dataValues.request.dataValues.customerID).then((customer) => {
                        TransportType.getAllTransportType().then((transportType) => {
                            res.render('roles/executor', {
                                typeUser: req.session.passport.user.userTypeID,
                                tasks: result,
                                assignedExecutorUsers: users,
                                customer: customer,
                                transportType: transportType
                            });
                        }).catch(error => {
                            console.warn(error);
                            res.render('roles/executor', {
                                typeUser: req.session.passport.user.userTypeID
                            });
                        });

                    });
                }).catch(error => {
                    console.warn(error);
                    res.render('roles/executor', {
                        typeUser: req.session.passport.user.userTypeID,
                    });
            })
                .catch(errors => {
                    console.warn(errors);
                    res.status(400).send({errors: errors});
                });

        })
        .catch(errors => {
            console.warn(errors);
           res.render('roles/executor', {
               typeUser: req.session.passport.user.userTypeID
           });
        });
});

router.put('/update-task/:id', validation.createAndUpdateTask(), (req, res) => {
    req.body.endTime = countEndTime(req.body.startTime, +req.body.estimationTime);

    Task
        .updateTask(req.body.id, req.body)
        .then(() => {

            Request
                .getRequestById(req.body.requestID)
                .then(request => {

                    Task
                        .getTaskById(req.body.id)
                        .then(task => {

                            Models.TaskDetail
                                .createTaskDetail(req.body.id, JSON.parse(req.body.detail))
                                .then(() => {

                                    Models.TaskDetail
                                        .updateDetailType(JSON.parse(req.body.changeDetail))
                                        .then(() => {

                                            Models.TaskDetail
                                                .deleteTaskDetail(JSON.parse(req.body.deleteDetail))
                                                .then(() => {

                                                    Models.TaskDetail
                                                        .getTaskDetail(req.body.id)
                                                        .then(details => {

                                                            res.status(200).send({
                                                                request: request,
                                                                task: task,
                                                                details: details
                                                            });
                                                        })
                                                        .catch(errors => {
                                                            console.warn(errors);
                                                            res.status(400).send({errors: errors});
                                                        });
                                                })
                                                .catch(errors => {
                                                    console.warn(errors);
                                                    res.status(400).send({errors: errors});
                                                });
                                        })
                                        .catch(errors => {
                                            console.warn(errors);
                                            res.status(400).send({errors: errors});
                                        });
                                })
                                .catch(errors => {
                                    console.warn(errors);
                                    res.status(400).send({errors: errors});
                                });
                        })
                        .catch(errors => {
                            console.warn(errors);
                            res.status(400).send({errors: errors});
                        });
                })
                .catch(errors => {
                    console.warn(errors);
                    res.status(400).send({errors: errors});
                });
        })
        .catch(errors => {
            console.warn(errors);
            res.status(400).send({errors: errors});
        });
});

router.put('/cancel-task/:id', (req, res) => {
    Task
        .updateTask(req.params.id, req.body)
        .then(() => {
            Task.getTaskById(req.params.id)
                .then(task =>{
                    console.log('task', task);
                    Models.TaskDetail
                    .getTaskDetail(task.dataValues.id)
                    .then(detail => {
                        console.log('detail', detail);
                        Request.getRequestById(task.requestID).then(request => {
                            res.status(200).send({
                                task: task,
                                detail: detail,
                                request: request[0]
                            })
                        }).catch(errors => {
                            console.warn(errors);
                            res.status(400).send({errors: errors});
                        });
                    })
                    .catch(errors => {
                        console.warn(errors);
                        res.status(400).send({errors: errors});
                    });
            }).catch(errors => {
                console.warn(errors);
                res.status(400).send({errors: errors});
            });

        })
        .catch(errors => {
            console.warn(errors);
            res.status(400).send({errors: errors});
        });
});

router.put('/set-task-status/:id', (req, res) => {
    Task
        .updateTask(req.params.id, req.body)
        .then(() => {
            Task
                .getTaskById(req.params.id)
                .then(task => {
                    Task
                        .getAllTasksStatusOfRequest(task.requestID)
                        .then(tasks => {
                            var counter = 1;
                            for (var key in tasks) {
                               if (tasks[key].dataValues.status !== 3) {
                                   break;
                               }
                               if(counter === tasks.length) {
                                   Request
                                       .changeStatus(task.requestID, {status:status.DONE})
                                       .then(() => {})
                                       .catch(errors => {
                                           console.warn(errors);
                                           res.status(400).send({errors: errors});
                                       });
                               }
                               counter++;
                            }

                            res.status(200).send();
                        })
                        .catch(errors => {
                            console.warn(errors);
                            res.status(400).send({errors: errors});
                        });
                })
                .catch(errors => {
                    console.warn(errors);
                    res.status(400).send({errors: errors});
                });
        })
        .catch(errors => {
            console.warn(errors);
            res.status(400).send({errors: errors});
        });
});

/* ============== DETAIL TYPE ============== */

router.get('/details-of-task/:id', (req, res) => {
    Models.TaskDetail
        .getTaskDetail(req.params.id)
        .then(details => {
            res.status(200).send({
                details: details
            })
        })
        .catch(error => {
            console.warn(error);
            res.status(400).send({errors: errors});
        });
});


router.post('/get-task-types', (req, res) => {
    Request
        .getRequestById(req.body.requestID)
        .then((request) => {
            Models.Detail
                .getDetailsByCarAttributes(request[0].transportTypeID, request[0].transportMarkkID, request[0].transportModelID)
                .then(detailTypes => {
                    res.status(200).send({
                        detailTypes: detailTypes
                    });
                })
                .catch(errors => {
                    console.warn(errors);
                    res.status(400).send({errors: errors});
                });
        })
        .catch(errors => {
            console.warn(errors);
            res.status(400).send({errors: errors});
        });
});

module.exports = router;
