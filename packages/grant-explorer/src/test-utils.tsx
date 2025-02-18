import { faker } from "@faker-js/faker";
import { ReduxRouter } from "@lagunovsky/redux-react-router";
import { render } from "@testing-library/react";
import { BigNumber, ethers } from "ethers";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "./app/store";
import { CartProvider } from "./context/CartContext";
import {
  initialRoundState,
  RoundContext,
  RoundState,
} from "./context/RoundContext";
import { RoundOverview } from "./features/api/rounds";
import {
  ApplicationStatus,
  Project,
  ProjectMetadata,
  Round,
} from "./features/api/types";
import history from "./history";
import { RoundMetadata } from "./features/api/round";

export const makeRoundData = (overrides: Partial<Round> = {}): Round => {
  const applicationsStartTime = faker.date.soon();
  const applicationsEndTime = faker.date.soon(10, applicationsStartTime);
  const roundStartTime = faker.date.future(1, applicationsEndTime);
  const roundEndTime = faker.date.soon(21, roundStartTime);

  // NB: set to seconds-level granularity for easier conversion and test assertions
  [
    applicationsStartTime,
    applicationsEndTime,
    roundStartTime,
    roundEndTime,
  ].forEach((date: Date) => {
    date.setMilliseconds(0);
  });

  return {
    id: faker.finance.ethereumAddress(),
    roundMetadata: {
      name: faker.company.name(),
      eligibility: { description: "name", requirements: [] },
      programContractAddress: faker.finance.ethereumAddress(),
      quadraticFundingConfig: {
        matchingFundsAvailable: 99999,
        matchingCap: false,
        matchingCapAmount: 0,
        minDonationThreshold: false,
        minDonationThresholdAmount: 0,
        sybilDefense: true,
      },
    },
    store: {
      protocol: 1,
      pointer: generateIpfsCid(),
    },
    applicationsStartTime,
    applicationsEndTime,
    roundStartTime,
    roundEndTime,
    token: faker.finance.ethereumAddress(),
    votingStrategy: faker.finance.ethereumAddress(),
    ownedBy: faker.finance.ethereumAddress(),
    ...overrides,
  };
};

export const makeApprovedProjectData = (
  overrides?: Partial<Project>,
  projectMetadataOverrides?: Partial<ProjectMetadata>
): Project => {
  return {
    grantApplicationId: `${faker.finance.ethereumAddress()}-${faker.finance.ethereumAddress()}`,
    grantApplicationFormAnswers: [],
    projectRegistryId: faker.datatype.number().toString(),
    recipient: faker.finance.ethereumAddress(),
    projectMetadata: {
      title: faker.company.name(),
      description: faker.lorem.sentence(),
      website: faker.internet.url(),
      projectTwitter: faker.internet.userName(),
      createdAt: new Date().valueOf(),
      projectGithub: faker.internet.userName(),
      userGithub: faker.internet.userName(),
      owners: [{ address: faker.finance.ethereumAddress() }],
      ...projectMetadataOverrides,
    },
    status: ApplicationStatus.APPROVED,
    applicationIndex: faker.datatype.number(),
    ...overrides,
  };
};

export const makeRoundOverviewData = (
  overrides?: Partial<RoundOverview>,
  roundMetadataOverrides?: Partial<RoundMetadata>
): RoundOverview => {
  return {
    id: faker.finance.ethereumAddress(),
    chainId: "1",
    roundMetaPtr: {
      protocol: 1,
      pointer: generateIpfsCid(),
    },
    applicationMetaPtr: {
      protocol: 1,
      pointer: generateIpfsCid(),
    },
    applicationsStartTime: faker.date.soon().toString(),
    applicationsEndTime: faker.date.soon(10).toString(),
    roundStartTime: faker.date.soon(20).toString(),
    roundEndTime: faker.date.soon(30).toString(),
    matchAmount: "1000000000000000000000000",
    token: faker.finance.ethereumAddress(),
    roundMetadata: {
      name: faker.company.name(),
      eligibility: {
        description: faker.lorem.sentence(),
        requirements: [
          { requirement: faker.lorem.sentence() },
          { requirement: faker.lorem.sentence() },
        ],
      },
      programContractAddress: faker.finance.ethereumAddress(),
      ...roundMetadataOverrides,
    },
    ...overrides,
  };
};

export function generateIpfsCid() {
  return faker.random.alpha({ count: 59, casing: "lower" });
}

export const renderWithContext = (
  ui: JSX.Element,
  roundStateOverrides: Partial<RoundState> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any = jest.fn()
) =>
  render(
    <MemoryRouter>
      <RoundContext.Provider
        value={{
          state: { ...initialRoundState, ...roundStateOverrides },
          dispatch,
        }}
      >
        <CartProvider>{ui}</CartProvider>
      </RoundContext.Provider>
    </MemoryRouter>
  );

export const renderWrapped = (ui: JSX.Element) => {
  render(
    <Provider store={store}>
      <ReduxRouter store={store} history={history}>
        {ui}
      </ReduxRouter>
    </Provider>
  );
};

export const mockBalance = {
  data: {
    value: BigNumber.from(ethers.utils.parseUnits("10", 18)),
  },
};

export const mockSigner = {
  data: {},
};

export const mockNetwork = {
  chain: { id: 5, name: "Goerli" },
  chains: [
    { id: 10, name: "Optimism" },
    { id: 5, name: "Goerli" },
  ],
};
