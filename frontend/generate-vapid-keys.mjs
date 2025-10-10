import webpush from 'web-push';

// Générer les clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 Clés VAPID générées :');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('');
console.log('📝 Ajoutez ces clés à vos variables d\'environnement :');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);