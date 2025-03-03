import { doc, setDoc } from 'firebase/firestore/lite';
import { db } from '../firebaseConfig';

const Host = () => {
  return (
    <div>
      <button
        onClick={() =>{ 
          try{
            setDoc(doc(db,"Folder","Test"),{
            player1: "HelloWorld"
            });
            console.log('setdoc');
          } catch(error){
            console.log('error')
          }
        }}
          className="border-2"
      >
        host
      </button>
      Host
    </div>
  );
};

export default Host;