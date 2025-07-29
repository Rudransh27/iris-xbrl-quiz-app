// import { DOMParser } from 'xmldom';

// function getExplicitMembers(doc) {
//   const members = [];
//   const nodes = doc.getElementsByTagName('xbrldi:explicitMember');
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     const dimension = node.getAttribute('dimension');
//     const member = node.textContent.trim();
//     members.push({ dimension, member, node });
//   }
//   return members;
// }

// export function validateActivity1(inputXml) {
//   const taxonomyDimension = 'ex:RegionAxis';
//   const taxonomyMembers = new Set(['ex:AsiaMember', 'ex:EuropeMember']);
//   try {
//     const doc = new DOMParser().parseFromString(inputXml, 'text/xml');
//     const explicitMembers = getExplicitMembers(doc);

//     if (explicitMembers.length === 0) {
//       return { isCorrect: false, error: '❌ No explicitMember found.' };
//     }
//     for (const { dimension, member } of explicitMembers) {
//       if (dimension !== taxonomyDimension) {
//         return { isCorrect: false, error: `❌ Dimension "${dimension}" does not match taxonomy.` };
//       }
//       if (!taxonomyMembers.has(member)) {
//         return { isCorrect: false, error: `❌ Member "${member}" is not in taxonomy.` };
//       }
//     }
//     return { isCorrect: true, error: null };
//   } catch {
//     return { isCorrect: false, error: '❌ Invalid XML.' };
//   }
// }

// export function validateActivity2(inputXml) {
//   const taxonomyDimensions = new Set(['ex:RegionAxis']);
//   const taxonomyMembers = new Set(['ex:AsiaMember']);
//   try {
//     const doc = new DOMParser().parseFromString(inputXml, 'text/xml');
//     const explicitMembers = getExplicitMembers(doc);

//     for (const { dimension, member } of explicitMembers) {
//       if (!taxonomyDimensions.has(dimension)) return { isCorrect: false, error: `❌ Invalid dimension "${dimension}".` };
//       if (!taxonomyMembers.has(member)) return { isCorrect: false, error: `❌ Invalid member "${member}".` };
//     }
//     return { isCorrect: true, error: null };
//   } catch {
//     return { isCorrect: false, error: '❌ XML parse error.' };
//   }
// }

// export function validateActivity3(inputXml) {
//   const taxonomyDims = new Set(['ex:RegionAxis', 'ex:ProductAxis']);
//   const taxonomyMembers = new Set(['ex:AsiaMember', 'ex:Electronics', 'ex:Furniture']);
//   try {
//     const doc = new DOMParser().parseFromString(inputXml, 'text/xml');
//     const explicitMembers = getExplicitMembers(doc);

//     for (const { dimension, member } of explicitMembers) {
//       if (!taxonomyDims.has(dimension)) 
//         return { isCorrect: false, error: `❌ Dimension "${dimension}" not defined.` };
//       if (!taxonomyMembers.has(member)) 
//         return { isCorrect: false, error: `❌ Member "${member}" not defined.` };
//     }

//     const segmentElems = doc.getElementsByTagName('xbrli:segment');
//     const scenarioElems = doc.getElementsByTagName('xbrli:scenario');

//     let productAxisInSegment = false;
//     let productAxisInScenario = false;

//     if (segmentElems.length) {
//       const children = segmentElems[0].childNodes;
//       for (let i = 0; i < children.length; i++) {
//         const c = children[i];
//         if (c.nodeName === 'xbrldi:explicitMember' && c.getAttribute('dimension') === 'ex:ProductAxis') {
//           productAxisInSegment = true;
//         }
//       }
//     }
//     if (scenarioElems.length) {
//       const children = scenarioElems[0].childNodes;
//       for (let i = 0; i < children.length; i++) {
//         const c = children[i];
//         if (c.nodeName === 'xbrldi:explicitMember' && c.getAttribute('dimension') === 'ex:ProductAxis') {
//           productAxisInScenario = true;
//         }
//       }
//     }

//     if (!productAxisInScenario) {
//       return { isCorrect: false, error: '❌ ProductAxis must be inside <xbrli:scenario>.' };
//     }
//     if (productAxisInSegment) {
//       return { isCorrect: false, error: '❌ ProductAxis must not be inside <xbrli:segment>.' };
//     }
//     return { isCorrect: true, error: null };
//   } catch {
//     return { isCorrect: false, error: '❌ XML parsing error.' };
//   }
// }
