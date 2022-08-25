import { Dispatch } from "redux";
// import { RootState } from "../reducers";
import { ethers, BigNumber } from "ethers";
import RoundABI from "../contracts/abis/Round.json";
import { global } from "../global";
import {
  Round,
  MetaPtr,
  RoundMetadata,
  RoundApplicationMetadata,
} from "../types";
import PinataClient from "../services/pinata";
import { Status } from "../reducers/rounds";

const projectQuestion = {
  question: "Select a project you would like to apply for funding:",
  type: "PROJECT", // this will be a limited set [TEXT, TEXTAREA, RADIO, MULTIPLE]
  required: true,
};

const recipientAddressQuestion = {
  question: "Recipient Address",
  type: "RECIPIENT",
  required: true,
  info: "Address that will receive funds",
};

export const ROUNDS_LOADING_ROUND = "ROUNDS_LOADING_ROUND";
interface RoundsLoadingRoundAction {
  type: typeof ROUNDS_LOADING_ROUND;
  address: string;
  status: Status;
}

export const ROUNDS_ROUND_LOADED = "ROUNDS_ROUND_LOADED";
interface RoundsRoundLoadedAction {
  type: typeof ROUNDS_ROUND_LOADED;
  address: string;
  round: Round;
}

export const ROUNDS_UNLOADED = "ROUNDS_UNLOADED";
interface RoundsUnloadedAction {
  type: typeof ROUNDS_UNLOADED;
}

export const ROUNDS_LOADING_ERROR = "ROUNDS_LOADING_ERROR";
interface RoundsLoadingErrorAction {
  type: typeof ROUNDS_LOADING_ERROR;
  address: string;
  error: string;
}

export type RoundsActions =
  | RoundsLoadingRoundAction
  | RoundsRoundLoadedAction
  | RoundsUnloadedAction
  | RoundsLoadingErrorAction;

const roundLoaded = (address: string, round: Round): RoundsActions => ({
  type: ROUNDS_ROUND_LOADED,
  address,
  round,
});

const roundsUnloaded = (): RoundsActions => ({
  type: ROUNDS_UNLOADED,
});

const loadingError = (address: string, error: string): RoundsActions => ({
  type: ROUNDS_LOADING_ERROR,
  address,
  error,
});

export const unloadRounds = () => roundsUnloaded();

export const loadRound = (address: string) => async (dispatch: Dispatch) => {
  try {
    // address validation
    ethers.utils.getAddress(address);
  } catch (e) {
    dispatch(loadingError(address, "invalid address or address checksum"));
    console.error(e);
    return;
  }

  const { signer } = global;
  const contract = new ethers.Contract(address, RoundABI, signer);
  const pinataClient = new PinataClient();

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingApplicationsStartTime,
  });

  let applicationsStartTime;
  try {
    const ast: BigNumber = await contract.applicationsStartTime();
    applicationsStartTime = ast.toNumber();
  } catch (e) {
    dispatch(loadingError(address, "error loading application start time"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingApplicationsEndTime,
  });

  let applicationsEndTime;
  try {
    const aet: BigNumber = await contract.applicationsEndTime();
    applicationsEndTime = aet.toNumber();
  } catch (e) {
    dispatch(loadingError(address, "error loading application end time"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingRoundStartTime,
  });

  let roundStartTime;
  try {
    const rst: BigNumber = await contract.roundStartTime();
    roundStartTime = rst.toNumber();
  } catch (e) {
    dispatch(loadingError(address, "error loading round start time"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingRoundEndTime,
  });

  let roundEndTime;
  try {
    const ret: BigNumber = await contract.roundEndTime();
    roundEndTime = ret.toNumber();
  } catch (e) {
    dispatch(loadingError(address, "error loading round end time"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingToken,
  });

  let token;
  try {
    token = await contract.token();
  } catch (e) {
    dispatch(loadingError(address, "error loading round token"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingRoundMetaPtr,
  });

  let roundMetaPtr: MetaPtr;
  try {
    roundMetaPtr = await contract.roundMetaPtr();
  } catch (e) {
    dispatch(loadingError(address, "error loading round metaPtr"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingRoundMetadata,
  });

  let roundMetadata: RoundMetadata;
  try {
    const resp = await pinataClient.fetchText(roundMetaPtr.pointer);
    roundMetadata = JSON.parse(resp);
  } catch (e) {
    dispatch(loadingError(address, "error loading round metadata"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingApplicationMetaPtr,
  });

  let applicationMetaPtr: MetaPtr;
  try {
    applicationMetaPtr = await contract.applicationMetaPtr();
  } catch (e) {
    dispatch(loadingError(address, "error loading application metaPtr"));
    console.error(e);
    return;
  }

  dispatch({
    type: ROUNDS_LOADING_ROUND,
    address,
    status: Status.LoadingApplicationMetadata,
  });

  let applicationMetadata: RoundApplicationMetadata;
  let projectQuestionId;
  let recipientQuestionId;
  try {
    const resp = await pinataClient.fetchText(applicationMetaPtr.pointer);
    applicationMetadata = JSON.parse(resp);

    if (applicationMetadata.applicationSchema === undefined) {
      applicationMetadata.applicationSchema =
        applicationMetadata.application_schema;
    }

    projectQuestionId = applicationMetadata.applicationSchema.length;
    applicationMetadata.applicationSchema.unshift({
      ...projectQuestion,
      id: projectQuestionId,
    });
    applicationMetadata.projectQuestionId = projectQuestionId;

    recipientQuestionId = applicationMetadata.applicationSchema.length;
    applicationMetadata.applicationSchema.push({
      ...recipientAddressQuestion,
      id: recipientQuestionId,
    });
    applicationMetadata.recipientQuestionId = recipientQuestionId;
  } catch (e) {
    dispatch(loadingError(address, "error loading application metadata"));
    console.error(e);
    return;
  }

  const round = {
    address,
    applicationsStartTime,
    applicationsEndTime,
    roundStartTime,
    roundEndTime,
    token,
    roundMetaPtr: {
      protocol: BigNumber.from(roundMetaPtr.protocol).toString(),
      pointer: roundMetaPtr.pointer,
    },
    roundMetadata,
    applicationMetaPtr: {
      protocol: BigNumber.from(applicationMetaPtr.protocol).toString(),
      pointer: applicationMetaPtr.pointer,
    },
    applicationMetadata,
  };

  dispatch(roundLoaded(address, round));
};
