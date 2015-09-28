/**
 * Created by apple on 15-9-24.
 */
DB = {
    Service: new Mongo.Collection('Service', {idGeneration: 'MONGO'}),
    AlertPolicy: new Mongo.Collection('AlertPolicy', {idGeneration: 'MONGO'})
};