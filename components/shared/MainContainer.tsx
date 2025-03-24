import { PropsWithChildren, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { Component } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default ({ children }: PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                {children}
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',  // Vertically centers content
        alignItems: 'center',      // Horizontally centers content
    }
})