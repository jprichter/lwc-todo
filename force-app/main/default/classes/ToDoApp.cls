public with sharing class ToDoApp {

    @AuraEnabled(cacheable=false)
    public static Task[] getToDos(String whatId){
        return [SELECT Id, Subject, Status, IsClosed
                FROM Task 
                WHERE OwnerId = :UserInfo.getUserId()
                  AND RecordType.Name = 'TODO'
                  AND WhatId = :whatId
                ORDER BY Status, CreatedDate DESC ];
    }

    @AuraEnabled
    public static void deleteToDo(String recordId){
        delete [SELECT Id FROM Task WHERE Id = :recordId];
    }

    @AuraEnabled
    public static void upsertToDo(Task newToDo){
        newToDo.RecordTypeId = Task.SObjectType.getDescribe().getRecordTypeInfosByName().get('TODO').getRecordTypeId();
        upsert newToDo;
    }
}
