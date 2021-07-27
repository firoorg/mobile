
#ifndef LELANTUS_WRAPPER_COREJNI_H
#define LELANTUS_WRAPPER_COREJNI_H

#include <jni.h>

/**
 *
 * @param env
 * @param thisObject
 * @return
 */
extern void *getJNIReference (
        JNIEnv *env,
        jobject thisObject);

#endif //LELANTUS_WRAPPER_COREJNI_H
