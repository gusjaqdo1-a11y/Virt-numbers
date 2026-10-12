package com.numelixa.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.firebase.messaging.FirebaseMessaging
class MainActivity: ComponentActivity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);FirebaseMessaging.getInstance().token.addOnSuccessListener{/* register token with Numelixa backend */};setContent{MaterialTheme{Surface{Column(Modifier.fillMaxSize().padding(24.dp)){Text("NUMELIXA",style=MaterialTheme.typography.labelLarge);Spacer(Modifier.height(28.dp));Text("Your numbers",style=MaterialTheme.typography.headlineMedium);Spacer(Modifier.height(12.dp));Text("Codes and notifications appear here.");Spacer(Modifier.height(28.dp));Button(onClick={/* app API call */}){Text("Buy a number")}}}}}}}
