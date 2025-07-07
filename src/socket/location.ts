export async function getLocation(io:any, messageData:any, callback:any, user:any){ 
          try {
            const data = messageData;
            const key = 'serverToSendLocation::' + user._id?.toString();
            return io.emit(key, data);
          } catch (error: any) {
            console.log('🚀 ~ error:', error);
            
          }  
}