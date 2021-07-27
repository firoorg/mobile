#include <stdlib.h>
#include "CoreJni.h"

#define JNI_NATIVE_REFERENCE_FIELD_NAME "id"
#define JNI_NATIVE_REFERENCE_FIELD_TYPE "J" // long

static jfieldID getJNIReferenceField(
        JNIEnv *env,
        jobject thisObject) {
    jclass thisClass = env->GetObjectClass(thisObject);
    jfieldID thisFieldId = env->GetFieldID(thisClass,
                                           JNI_NATIVE_REFERENCE_FIELD_NAME,
                                           JNI_NATIVE_REFERENCE_FIELD_TYPE);
    env->DeleteLocalRef(thisClass);
    return thisFieldId;
}

static jlong getJNIReferenceAddress(
        JNIEnv *env,
        jobject thisObject) {
    jfieldID coreBRKeyAddressField = getJNIReferenceField(env, thisObject);

    return env->GetLongField(thisObject, coreBRKeyAddressField);
}

extern void *getJNIReference(
        JNIEnv *env,
        jobject thisObject) {
    return (void *) getJNIReferenceAddress(env, thisObject);
}