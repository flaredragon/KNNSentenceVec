import React, { Component } from 'react'
import natural from 'natural'
import sw from 'remove-stopwords'
import pos from 'pos'
import lemmatize from 'wink-lemmatizer'
import synonyms from 'synonyms'
const json = require('./wordvecs5000.json');
const jwords = new Set(Object.keys(json.vectors)); 
console.log(jwords);

class Predict extends Component {
    constructor() {
        super()
        this.state = {
          value: "",
          sentvecs:[],
          nearestvecs:[],
	  psentence:[]      
        }
	natural.PorterStemmer.attach();
    }
  
  removeStopWords = (wordList) => { 
    return sw.removeStopwords(wordList);
  }

  taggingAndLemmatizing = (wordList) => {
    var tagger = new pos.Tagger();
    var taggedWords = tagger.tag(wordList);
    var newList = [];
    for (var i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      console.log(word,tag);
      if((tag==='NN')||(tag==='NNS')||(tag==='NNPS')||(tag==='NNP'))
      {
         newList.push(lemmatize.noun(word));
      }
      else if((tag==='VBD')||(tag==='VBG')||(tag==='VBN')||(tag==='VBP')||(tag==='VBZ'))
      {
         newList.push(lemmatize.verb(word));
      }
      else if((tag==='JJ')||(tag==='JJR')||(tag==='JJS'))
      {
         newList.push(lemmatize.adjective(word));
      }
      else {
        newList.push(word);
      }
    }
    return newList;
  }
  
  stemWords = (wordList) => {
  wordList.forEach((item,index) => {
    if(!jwords.has(item)){
      var stemmedWord = item.stem();
      if(jwords.has(stemmedWord)){
	wordList.splice(index, 1);
	wordList.push(stemmedWord);	
	}
     }
   }) 
  }
  
  synonymReplace = (wordList) => {
    wordList.forEach((item,index) => {
    if(!jwords.has(item)){
      wordList.splice(index, 1); 
      var sym = synonyms(item);
      console.log(item,sym);
      if(sym!==undefined){
      var types = Object.values(sym);
	console.log(types);   
      types.forEach((i) => { 
	console.log(i);       
	i.every((word) => {
          if(jwords.has(word)){
            wordList.push(word);
            return false;
          }
          else return true;
        })
      })
     }
     var stemItem = item.stem();
     var symstem = synonyms(stemItem);
      console.log(stemItem,symstem);
      if(symstem!==undefined){
      var typesstem = Object.values(symstem);
	console.log(typesstem);   
      typesstem.forEach((i) => { 
	console.log(i);       
	i.every((word) => {
          if(jwords.has(word)){
            wordList.push(word);
            return false;
          }
          else return true;
        })
      })
     }
    }
    });
   return wordList; 
  }

  tokenizing = (sentence) => {
    var tokenizer = new natural.WordTokenizer();
    var tSentence = tokenizer.tokenize(sentence);  
    return tSentence;
  }

  calcTfidf = (sentenceList) => {
    var TfIdf = natural.TfIdf;
    var tfidf = new TfIdf();
    sentenceList.forEach((t) => {
      tfidf.addDocument(t.text);
    });
    return tfidf;
  }


   predicting = async(e) => {
    e.preventDefault();
    var sentenceList = this.props.list;
    var sproc = [];
    var svecs=[];
    var tfidf = this.calcTfidf(sentenceList);
    //var fvalue = new Array(300).fill(0.0);
    sentenceList.forEach((t,docnum) => {
        var sentence = this.tokenizing(t.text);
        var s1 = this.removeStopWords(sentence);
        //console.log(s1);
        var s2 = this.taggingAndLemmatizing(s1);
        //console.log(s2);
        var s3 = this.synonymReplace(s2);
        //console.log(s3);
	var fset = [ ...new Set(s3) ];
	sproc.push(fset);
	var fvalue = new Array(300).fill(0.0);
        s3.forEach((item) =>{
	if(jwords.has(item)){
        var temp = json.vectors[`${item}`];
        var weight = tfidf.tfidf(item,docnum);
        console.log(item,weight,temp);
        for(var i=0;i<300;i++){
          //console.log(fvalue[i],temp[i]);
          fvalue[i]=fvalue[i]+temp[i]*weight;
          //console.log('t',fvalue[i]);
          }
	 }
        });
	//console.log(json.vectors.lovely,json.vectors.hate);
        console.log(fvalue);
        svecs.push(fvalue);
	console.log(svecs);
    });
    console.log(svecs);
    this.setState({sentvecs:svecs,psentence:sproc});
    //console.log("haha");
   } 
   
  knn = (e) => {
     e.preventDefault();
     var sentence = this.state.value;
     var prevec = new Array(300).fill(0.0);
     var s0 = this.tokenizing(sentence);
     var s1 = this.removeStopWords(s0);
     var s2 = this.taggingAndLemmatizing(s1);
     var s3 = this.synonymReplace(s2);
     s3.forEach((item) =>{
      var temp = json.vectors[`${item}`];
      console.log(item,temp);
      for(var i=0;i<300;i++){
        prevec[i]=prevec[i]+temp[i];
        }
      });
     console.log(prevec);
     var dist=0;
     var arr=[];
     var svec = this.state.sentvecs;
     console.log('svec',svec);
     svec.forEach((i,index) => {
	   dist=0;
	   //console.log(i,prevec);
	   for(var j=0;j<300;j++)
	    {
	      dist = dist + Math.pow((i[j]-prevec[j]),2);	
	    }
     dist= Math.sqrt(dist);
     arr.push({ distance:dist, sentence:this.props.list[index].text });
     });
     arr.sort(function(a, b){return b.distance-a.distance});
     for(var n=0;n<svec.length;n++)
     {
       console.log(arr[n]);	
     }
     this.setState({nearestvecs:arr});   	
  }

   handleChange = (e) => {
       this.setState({value:e.target.value});
   }

  render() {
    var pdata = this.state.psentence
    var knn = this.state.nearestvecs
 
	return (
      <div className="todoListMain">
	<div className="header column">      
	<button onClick={this.predicting}>Analyze the Data</button>
	<div> 	
	<ul className="theList">
        {pdata.map(t => <li key={t}>{t.toString()}</li>)}
     	</ul>
	</div>
       </div>       
        <div className="header column">
          <form onSubmit={this.knn}>
            <input onChange={this.handleChange}/>
            <button type="submit"> Predict </button>
          </form>
	<div>
	<ul className="theList">
	{knn.map(m => <li key={m.distance}>{m.sentence}, Distance = {m.distance}</li>)}
	</ul>        
	</div>
	</div>
      </div>
    )
  }
}

export default Predict
